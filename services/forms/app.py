"""ChefKart Form Processing Service — Flask-based form validation, confirmation, and SQLite CRUD."""
import os
import secrets
from datetime import date
from pathlib import Path
from flask import Flask, abort, flash, redirect, render_template, request, session, url_for
from db import close_db, get_db, init_db
from validation import (
    CHEF_CHOICES, STAFF_ROLES, validate_appointment, validate_chef,
    validate_cook, validate_employee,
)


def create_app(test_config=None):
    """Create an app; tests can supply a temporary database and test secret."""
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=os.environ.get("CHEFKART_FLASK_SECRET") or secrets.token_hex(32),
        DATABASE=os.environ.get("CHEFKART_FLASK_DATABASE") or str(Path(app.instance_path) / "chefkart.sqlite3"),
        MAX_CONTENT_LENGTH=64 * 1024,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
    )
    if test_config:
        app.config.update(test_config)
    Path(app.config["DATABASE"]).parent.mkdir(parents=True, exist_ok=True)
    app.teardown_appcontext(close_db)
    with app.app_context():
        init_db()  # CREATE IF NOT EXISTS does not reset saved records.

    def csrf_token():
        """One unpredictable value links submitted forms to this browser session."""
        if "csrf_token" not in session:
            session["csrf_token"] = secrets.token_hex(32)
        return session["csrf_token"]

    @app.context_processor
    def shared_template_values():
        return {"csrf_token": csrf_token, "today": date.today().isoformat()}

    @app.before_request
    def protect_forms():
        """Check every POST before a form route can change or confirm anything."""
        if request.method == "POST":
            expected = session.get("csrf_token", "")
            provided = request.form.get("csrf_token", "")
            if not expected or not secrets.compare_digest(expected.encode(), provided.encode()):
                abort(403, description="Reload the form and submit it again.")

    @app.template_filter("rupees")
    def rupees(paise):
        """Display integer paise as rupees without changing the stored amount."""
        return f"INR {paise // 100:,}.{paise % 100:02d}"

    @app.get("/")
    def home():
        return render_template("home.html")

    # Cook details form — validate name + cuisine and display confirmation.
    @app.route("/cook-form", methods=["GET", "POST"])
    def cook_form():
        errors = {}
        if request.method == "POST":
            values, errors = validate_cook(request.form)
            if not errors:
                return render_template(
                    "confirmation.html", title="Cook details validated",
                    description="Your name and cuisine passed the form checks.",
                    details=[("Cook name", values["name"]), ("Cuisine", values["cuisine"])],
                    back_url=url_for("cook_form"),
                    note="This form displays your details. Use Chef records to save a profile.",
                )
        return render_template("cook_form.html", values=request.form, errors=errors), 400 if errors else 200

    # Cooking appointment form — validate customer, cook selection, date, and phone.
    @app.route("/appointment", methods=["GET", "POST"])
    def appointment():
        errors = {}
        if request.method == "POST":
            values, errors = validate_appointment(request.form)
            if not errors:
                return render_template(
                    "confirmation.html", title="Appointment details confirmed",
                    description="Review the validated cooking appointment details below.",
                    details=[("Customer", values["name"]), ("Cook", CHEF_CHOICES[values["chef"]]),
                             ("Appointment date", values["appointment_date"]), ("Contact", values["phone"])],
                    back_url=url_for("appointment"),
                    note="This form preview does not reserve a cooking slot or save an appointment.",
                )
        return render_template("appointment.html", values=request.form, errors=errors,
                               chef_choices=CHEF_CHOICES.items()), 400 if errors else 200

    # Chef profile CRUD — read all cook profiles from SQLite.
    @app.get("/chefs")
    def chefs():
        rows = get_db().execute("SELECT * FROM chefs ORDER BY id DESC").fetchall()
        return render_template("chefs.html", chefs=rows)

    def find_chef(chef_id):
        """Use a bound value instead of adding user input into SQL text."""
        row = get_db().execute("SELECT * FROM chefs WHERE id = ?", (chef_id,)).fetchone()
        if row is None:
            abort(404, description="This cook profile was not found.")
        return row

    # CREATE: validate, INSERT into SQLite, commit, redirect to prevent resubmission.
    @app.route("/chefs/new", methods=["GET", "POST"])
    def create_chef():
        errors = {}
        if request.method == "POST":
            values, errors = validate_chef(request.form)
            if not errors:
                db = get_db()
                db.execute(
                    "INSERT INTO chefs (name, cuisine, city, fee_paise, available) VALUES (?, ?, ?, ?, ?)",
                    (values["name"], values["cuisine"], values["city"], values["fee_paise"], values["available"]),
                )
                db.commit()  # Persist the row after the connection closes.
                flash("Cook profile saved.")
                return redirect(url_for("chefs"))
        return render_template("chef_form.html", title="Add a cook", values=request.form,
                               errors=errors), 400 if errors else 200

    # UPDATE: GET pre-fills the form; POST validates and updates that one row.
    @app.route("/chefs/<int:chef_id>/edit", methods=["GET", "POST"])
    def edit_chef(chef_id):
        row = find_chef(chef_id)
        errors = {}
        values = dict(row)
        values["fee"] = f"{row['fee_paise'] // 100}.{row['fee_paise'] % 100:02d}"
        values["available"] = str(row["available"])
        if request.method == "POST":
            cleaned, errors = validate_chef(request.form)
            values = request.form
            if not errors:
                db = get_db()
                db.execute(
                    "UPDATE chefs SET name = ?, cuisine = ?, city = ?, fee_paise = ?, available = ? WHERE id = ?",
                    (cleaned["name"], cleaned["cuisine"], cleaned["city"], cleaned["fee_paise"], cleaned["available"], chef_id),
                )
                db.commit()
                flash("Cook profile updated.")
                return redirect(url_for("chefs"))
        return render_template("chef_form.html", title="Edit cook profile", values=values,
                               errors=errors), 400 if errors else 200

    # DELETE is POST-only: opening a link cannot accidentally delete a row.
    @app.post("/chefs/<int:chef_id>/delete")
    def delete_chef(chef_id):
        find_chef(chef_id)
        db = get_db()
        db.execute("DELETE FROM chefs WHERE id = ?", (chef_id,))
        db.commit()
        flash("Cook profile deleted.")
        return redirect(url_for("chefs"))

    # Kitchen staff management — accept details, store in SQLite, display records.
    @app.route("/employees", methods=["GET", "POST"])
    def employees():
        errors = {}
        if request.method == "POST":
            values, errors = validate_employee(request.form)
            if not errors:
                db = get_db()
                db.execute(
                    "INSERT INTO employees (name, role, phone, salary_paise) VALUES (?, ?, ?, ?)",
                    (values["name"], values["role"], values["phone"], values["salary_paise"]),
                )
                db.commit()
                flash("Staff record saved.")
                return redirect(url_for("employees"))
        rows = get_db().execute("SELECT * FROM employees ORDER BY id DESC").fetchall()
        return render_template("employees.html", values=request.form, errors=errors,
                               employees=rows, roles=STAFF_ROLES), 400 if errors else 200

    @app.errorhandler(403)
    @app.errorhandler(404)
    def readable_error(error):
        return render_template("error.html", error=error), error.code

    return app


if __name__ == "__main__":
    # Support dynamic PORT and HOST for cloud platforms like Render
    host = os.environ.get("HOST", "0.0.0.0" if os.environ.get("FLASK_ENV") == "production" else "127.0.0.1")
    port = int(os.environ.get("PORT") or os.environ.get("CHEFKART_FLASK_PORT", "5001"))
    create_app().run(host=host, port=port, debug=False)
