"""Readable input rules. Return cleaned values AND errors for redisplaying forms."""
import re
from datetime import date
from decimal import Decimal, InvalidOperation

CHEF_CHOICES = {
    "meera": "Meera Sharma - South Indian",
    "arjun": "Arjun Kumar - North Indian",
    "priya": "Priya Singh - Party cooking",
}
STAFF_ROLES = ["Cook", "Kitchen assistant", "Kitchen coordinator", "Customer support"]


def text_value(form, field, label, errors, minimum=2, maximum=80):
    """Trim text and reject empty, too short, or excessively long values."""
    value = form.get(field, "").strip()
    if not minimum <= len(value) <= maximum:
        errors[field] = f"{label} must contain {minimum} to {maximum} characters."
    return value


def money_value(form, field, label, errors, minimum, maximum):
    """Parse a rupee amount exactly, then convert it into integer paise."""
    raw = form.get(field, "").strip()
    if not re.fullmatch(r"\d{1,7}(\.\d{1,2})?", raw):
        errors[field] = f"Enter {label.lower()} as a number with at most two decimal places."
        return 0
    try:
        amount = Decimal(raw)
        if not minimum <= amount <= maximum:
            raise ValueError
        return int(amount * 100)
    except (InvalidOperation, ValueError):
        errors[field] = f"{label} must be between INR {minimum} and INR {maximum}."
        return 0


def phone_value(form, errors):
    """The classroom form accepts a ten-digit Indian contact number."""
    phone = form.get("phone", "").strip()
    if not re.fullmatch(r"[0-9]{10}", phone):
        errors["phone"] = "Enter a contact number containing exactly 10 digits."
    return phone


def validate_cook(form):
    """Validate a cook's name and cuisine/specialization."""
    errors = {}
    values = {
        "name": text_value(form, "name", "Cook name", errors),
        "cuisine": text_value(form, "cuisine", "Cuisine", errors),
    }
    return values, errors


def validate_appointment(form):
    """Validate the customer, selected cook, date and phone for an appointment."""
    errors = {}
    values = {
        "name": text_value(form, "name", "Customer name", errors),
        "chef": form.get("chef", ""),
        "appointment_date": form.get("appointment_date", ""),
        "phone": phone_value(form, errors),
    }
    if values["chef"] not in CHEF_CHOICES:
        errors["chef"] = "Choose a cook from the list."
    try:
        raw = values["appointment_date"]
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
            raise ValueError
        chosen_date = date.fromisoformat(raw)
        if chosen_date < date.today():
            errors["appointment_date"] = "Choose today or a future date."
    except ValueError:
        errors["appointment_date"] = "Enter a valid appointment date."
    return values, errors


def validate_chef(form):
    """Validate the fields saved in the SQLite chefs table."""
    values, errors = validate_cook(form)
    values["city"] = text_value(form, "city", "City", errors)
    values["fee_paise"] = money_value(form, "fee", "Visit fee", errors, 100, 100000)
    available = form.get("available", "")
    if available not in ("0", "1"):
        errors["available"] = "Choose Available or Unavailable."
    values["available"] = 1 if available == "1" else 0
    return values, errors


def validate_employee(form):
    """Validate a ChefKart staff record before inserting it."""
    errors = {}
    values = {
        "name": text_value(form, "name", "Staff name", errors),
        "role": form.get("role", ""),
        "phone": phone_value(form, errors),
        "salary_paise": money_value(form, "salary", "Monthly salary", errors, 1, 1000000),
    }
    if values["role"] not in STAFF_ROLES:
        errors["role"] = "Choose a valid staff role."
    return values, errors
