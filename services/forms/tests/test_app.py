"""Run from project root: python -m pytest services/forms/tests/ -v
Or: cd services/forms && python -m unittest discover -s tests -v

Each test uses a temporary SQLite file, never the user's saved records.
"""
import os
import sys
import sqlite3
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

# Ensure the forms service package is importable from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app


class ChefKartFormsTest(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.database = str(Path(self.folder.name) / "test.sqlite3")
        self.config = {"TESTING": True, "SECRET_KEY": "test-only-secret", "DATABASE": self.database}
        self.app = create_app(self.config)
        self.client = self.app.test_client()
        self.client.get("/cook-form")
        with self.client.session_transaction() as browser_session:
            self.token = browser_session["csrf_token"]

    def tearDown(self):
        self.folder.cleanup()

    def post(self, path, data):
        return self.client.post(path, data={**data, "csrf_token": self.token}, follow_redirects=True)

    def rows(self, table):
        # The table name comes only from test constants, never from a web request.
        with sqlite3.connect(self.database) as connection:
            connection.row_factory = sqlite3.Row
            return [dict(row) for row in connection.execute(f"SELECT * FROM {table}")]

    def chef(self, **changes):
        return {"name": "Meera Sharma", "cuisine": "South Indian", "city": "Bengaluru",
                "fee": "499.95", "available": "1", **changes}

    def appointment(self, **changes):
        return {"name": "Asha Rao", "chef": "meera", "appointment_date": date.today().isoformat(),
                "phone": "9876543210", **changes}

    def employee(self, **changes):
        return {"name": "Ravi Kumar", "role": "Kitchen assistant", "phone": "9876543210",
                "salary": "18000.50", **changes}

    def test_all_exercise_pages_load(self):
        for path in ["/", "/cook-form", "/appointment", "/chefs", "/chefs/new", "/employees"]:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_cook_form_trims_displays_and_does_not_store(self):
        response = self.post("/cook-form", {"name": "  Meera Sharma  ", "cuisine": "South Indian"})
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Cook details validated", response.data)
        self.assertIn(b"Meera Sharma", response.data)
        self.assertEqual(self.rows("chefs"), [])

    def test_cook_form_rejects_missing_or_long_values(self):
        for name in ["", " ", "A", "A" * 81]:
            with self.subTest(name_length=len(name)):
                response = self.post("/cook-form", {"name": name, "cuisine": ""})
                self.assertEqual(response.status_code, 400)
                self.assertIn(b"Cuisine must contain", response.data)

    def test_appointment_accepts_today_and_future_without_storing(self):
        for chosen in [date.today(), date.today() + timedelta(days=7)]:
            response = self.post("/appointment", self.appointment(appointment_date=chosen.isoformat()))
            self.assertEqual(response.status_code, 200)
            self.assertIn(b"Appointment details confirmed", response.data)
            self.assertIn(b"does not reserve", response.data)
        self.assertEqual(self.rows("chefs"), [])

    def test_appointment_rejects_past_invalid_date_cook_and_phone(self):
        invalid = [{"appointment_date": (date.today() - timedelta(days=1)).isoformat()},
                   {"appointment_date": "2027-02-30"}, {"appointment_date": "20270101"},
                   {"appointment_date": ""}, {"chef": "unlisted-cook"}, {"phone": "123"}]
        for changes in invalid:
            with self.subTest(changes=changes):
                self.assertEqual(self.post("/appointment", self.appointment(**changes)).status_code, 400)

    def test_chef_create_read_update_delete(self):
        self.assertEqual(self.post("/chefs/new", self.chef()).status_code, 200)
        saved = self.rows("chefs")[0]
        self.assertEqual(saved["fee_paise"], 49995)
        chef_id = saved["id"]
        edit = self.client.get(f"/chefs/{chef_id}/edit")
        self.assertIn(b'value="499.95"', edit.data)
        updated = self.post(f"/chefs/{chef_id}/edit", self.chef(fee="549.05", available="0"))
        self.assertIn(b"INR 549.05", updated.data)
        self.assertIn(b"Unavailable", updated.data)
        self.assertEqual(self.rows("chefs")[0]["fee_paise"], 54905)
        self.assertEqual(self.rows("chefs")[0]["available"], 0)
        deleted = self.post(f"/chefs/{chef_id}/delete", {})
        self.assertIn(b"Cook profile deleted", deleted.data)
        self.assertEqual(self.rows("chefs"), [])

    def test_invalid_chef_create_and_update_do_not_change_records(self):
        for changes in [{"fee": "99"}, {"fee": "100001"}, {"fee": "499.999"},
                        {"fee": "NaN"}, {"available": "yes"}, {"city": ""}]:
            with self.subTest(changes=changes):
                self.assertEqual(self.post("/chefs/new", self.chef(**changes)).status_code, 400)
        self.assertEqual(self.rows("chefs"), [])
        self.post("/chefs/new", self.chef())
        before = self.rows("chefs")
        self.assertEqual(self.post(f"/chefs/{before[0]['id']}/edit", self.chef(fee="-1")).status_code, 400)
        self.assertEqual(self.rows("chefs"), before)

    def test_database_survives_a_new_app_instance(self):
        self.post("/chefs/new", self.chef())
        self.post("/employees", self.employee())
        restarted = create_app(self.config).test_client()
        self.assertIn(b"Meera Sharma", restarted.get("/chefs").data)
        self.assertIn(b"Ravi Kumar", restarted.get("/employees").data)
        self.assertEqual(len(self.rows("chefs")), 1)
        self.assertEqual(len(self.rows("employees")), 1)

    def test_employee_is_saved_and_displayed_after_redirect(self):
        response = self.post("/employees", self.employee())
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Ravi Kumar", response.data)
        self.assertIn(b"INR 18,000.50", response.data)
        self.assertEqual(self.rows("employees")[0]["salary_paise"], 1800050)
        self.client.get("/employees")  # Refresh does not insert a duplicate.
        self.assertEqual(len(self.rows("employees")), 1)

    def test_employee_rejects_invalid_fields(self):
        for changes in [{"name": ""}, {"role": "Unknown"}, {"phone": "123abc4567"},
                        {"salary": "0"}, {"salary": "1000001"}, {"salary": "1.234"}]:
            with self.subTest(changes=changes):
                self.assertEqual(self.post("/employees", self.employee(**changes)).status_code, 400)
        self.assertEqual(self.rows("employees"), [])

    def test_missing_and_invalid_csrf_are_rejected(self):
        for token in [None, "wrong", "\u2603"]:
            data = self.chef()
            if token is not None:
                data["csrf_token"] = token
            self.assertEqual(self.client.post("/chefs/new", data=data).status_code, 403)
        self.assertEqual(self.rows("chefs"), [])

    def test_delete_requires_post_and_missing_profiles_return_404(self):
        self.post("/chefs/new", self.chef())
        chef_id = self.rows("chefs")[0]["id"]
        self.assertEqual(self.client.get(f"/chefs/{chef_id}/delete").status_code, 405)
        self.assertEqual(len(self.rows("chefs")), 1)
        self.assertEqual(self.client.get("/chefs/99999/edit").status_code, 404)
        self.assertEqual(self.post("/chefs/99999/delete", {}).status_code, 404)

    def test_html_is_escaped_and_sql_values_are_bound(self):
        script_name = "<script>alert(1)</script>"
        response = self.post("/cook-form", {"name": script_name, "cuisine": "Indian"})
        self.assertNotIn(script_name.encode(), response.data)
        self.assertIn(b"&lt;script&gt;", response.data)
        sql_name = "Meera'); DROP TABLE chefs; --"
        self.post("/chefs/new", self.chef(name=sql_name))
        self.assertEqual(self.rows("chefs")[0]["name"], sql_name)
        self.post("/chefs/new", self.chef())
        self.assertEqual(len(self.rows("chefs")), 2)


if __name__ == "__main__":
    unittest.main()
