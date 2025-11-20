# -----------------------------------------------------------
# FINAL app.py — ONLY CORS + OPTIONS FIX APPLIED (NO OTHER CHANGES)
# -----------------------------------------------------------

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from passlib.hash import pbkdf2_sha256
import jwt
import datetime
from functools import wraps
import os
from dotenv import load_dotenv
from itsdangerous import URLSafeTimedSerializer

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

app = Flask(__name__)

# ---------------------- CORS (FIXED) ----------------------
CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000"]   # preflight now works
)

# ---------------------- DATABASE ----------------------
instance_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "instance")
os.makedirs(instance_path, exist_ok=True)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(instance_path, "app.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY") or "dev_secret"

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# ---------------------- RATE LIMITER ----------------------
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri="memory://"
)

serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

# ---------------------- COOKIE SETTINGS ----------------------
def cookie_settings():
    return dict(
        httponly=True,
        secure=True,
        samesite="None",
        path="/",
        domain="localhost"
    )

# ---------------------- AUTO CLEAR OLD COOKIES (FIXED OPTIONS) ----------------------
@app.before_request
def auto_clear_old_cookie():

    # 🟢 FIX: Allow preflight OPTIONS to pass without being blocked
    if request.method == "OPTIONS":
        return

    if "access_token" in request.cookies:
        token = request.cookies.get("access_token")

        if not token or token.count('.') != 2:
            resp = jsonify({"message": "Stale cookie cleared"})
            resp.set_cookie("access_token", "", expires=0, **cookie_settings())
            return resp

# ---------------------- AUTH DECORATOR ----------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("access_token")
        if not token:
            return jsonify({"message": "Missing token"}), 401

        try:
            data = jwt.decode(
                token,
                app.config["SECRET_KEY"],
                algorithms=["HS256"]
            )
            user = User.query.get(data["id"])
            if not user:
                return jsonify({"message": "User not found"}), 401
        except Exception:
            return jsonify({"message": "Invalid token"}), 401

        return f(user, *args, **kwargs)
    return decorated

# ---------------------- MODELS ----------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(10), nullable=False)
    description = db.Column(db.String(255))
    category = db.Column(db.String(50))
    date = db.Column(db.Date)

# ---------------------- HELPERS ----------------------
def valid_password(pw):
    return pw and len(pw) >= 6 and any(c.isdigit() for c in pw) and any(c.isalpha() for c in pw)

def set_cookie(response, token):
    response.set_cookie("access_token", token, **cookie_settings())
    return response

# ---------------------- REGISTER ----------------------
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    email = data.get("email", "").strip().lower()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not email or not username or not password:
        return jsonify({"message": "All fields required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400

    if not valid_password(password):
        return jsonify({"message": "Weak password"}), 400

    hashed = pbkdf2_sha256.hash(password)
    user = User(email=email, username=username, password=hashed)

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registered successfully"})

# ---------------------- LOGIN ----------------------
@app.route("/login", methods=["POST"])
@limiter.limit("5/min")
def login():
    data = request.get_json()
    ident = data.get("username") or data.get("email")
    password = data.get("password")

    user = User.query.filter(
        (User.username == ident) | (User.email == ident)
    ).first()

    if not user or not pbkdf2_sha256.verify(password, user.password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode(
        {"id": user.id, "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)},
        app.config["SECRET_KEY"],
        algorithm="HS256"
    )

    res = jsonify({"message": "Logged in"})
    return set_cookie(res, token)

# ---------------------- LOGOUT ----------------------
@app.route("/logout", methods=["POST"])
def logout():
    res = jsonify({"message": "Logged out"})
    res.set_cookie("access_token", "", expires=0)
    return res

# ---------------------- WHO AM I ----------------------
@app.route("/me", methods=["GET"])
@token_required
def me(user):
    return jsonify({"id": user.id, "email": user.email, "username": user.username})

# ---------------------- UPDATE USERNAME ----------------------
@app.route("/update-username", methods=["POST"])
@token_required
def update_username(user):
    new_username = request.json.get("username", "").strip()
    if not new_username:
        return jsonify({"message": "Username required"}), 400

    if User.query.filter_by(username=new_username).first():
        return jsonify({"message": "Username already taken"}), 400

    user.username = new_username
    db.session.commit()

    return jsonify({"message": "Username updated"})

# ---------------------- UPDATE EMAIL ----------------------
@app.route("/update-email", methods=["POST"])
@token_required
def update_email(user):
    new_email = request.json.get("email", "").strip().lower()

    if not new_email:
        return jsonify({"message": "Email required"}), 400

    if User.query.filter_by(email=new_email).first():
        return jsonify({"message": "Email already in use"}), 400

    user.email = new_email
    db.session.commit()

    return jsonify({"message": "Email updated"})

# ---------------------- CHANGE PASSWORD ----------------------
@app.route("/change-password", methods=["POST"])
@token_required
def change_password(user):
    old_pw = request.json.get("old_password")
    new_pw = request.json.get("new_password")

    if not pbkdf2_sha256.verify(old_pw, user.password):
        return jsonify({"message": "Old password incorrect"}), 400

    if not valid_password(new_pw):
        return jsonify({"message": "Weak new password"}), 400

    user.password = pbkdf2_sha256.hash(new_pw)
    db.session.commit()

    return jsonify({"message": "Password changed"})

# ---------------------- DELETE ACCOUNT ----------------------
@app.route("/delete-account", methods=["POST"])
@token_required
def delete_account(user):
    Transaction.query.filter_by(user_id=user.id).delete()

    db.session.delete(user)
    db.session.commit()

    res = jsonify({"message": "Account deleted"})
    res.set_cookie("access_token", "", expires=0, **cookie_settings())
    return res

# ---------------------- FORGOT PASSWORD ----------------------
@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    email = request.json.get("email", "").strip().lower()

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "If account exists, email sent"})

    token = serializer.dumps(email, salt="reset")
    reset_link = f"http://localhost:3000/reset-password?token={token}"

    print("RESET LINK:", reset_link)

    return jsonify({"message": "If account exists, email sent"})

# ---------------------- RESET PASSWORD ----------------------
@app.route("/reset-password", methods=["POST"])
def reset_password():
    token = request.json.get("token")
    new_pw = request.json.get("new_password")

    try:
        email = serializer.loads(token, salt="reset", max_age=3600)
    except:
        return jsonify({"message": "Invalid or expired link"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.password = pbkdf2_sha256.hash(new_pw)
    db.session.commit()

    return jsonify({"message": "Password updated"})

# ---------------------- TRANSACTIONS ----------------------
@app.route("/transactions", methods=["GET"])
@token_required
def get_transactions(user):
    items = Transaction.query.filter_by(user_id=user.id).all()
    return jsonify([
        {
            "id": t.id,
            "amount": t.amount,
            "type": t.type,
            "description": t.description,
            "category": t.category,
            "date": t.date.isoformat(),
        }
        for t in items
    ])

@app.route("/transactions", methods=["POST"])
@token_required
def add_transaction(user):
    data = request.get_json()
    tr = Transaction(
        user_id=user.id,
        amount=float(data["amount"]),
        type=data["type"],
        description=data.get("description", ""),
        category=data.get("category", "Other"),
        date=datetime.datetime.strptime(data["date"], "%Y-%m-%d").date(),
    )
    db.session.add(tr)
    db.session.commit()
    return jsonify({"message": "Transaction added"})

@app.route("/transactions/<int:id>", methods=["DELETE"])
@token_required
def delete_transaction(user, id):
    tr = Transaction.query.filter_by(id=id, user_id=user.id).first()
    if not tr:
        return jsonify({"message": "Not found"}), 404
    db.session.delete(tr)
    db.session.commit()
    return jsonify({"message": "Deleted"})

@app.route("/transactions/<int:id>", methods=["PUT"])
@token_required
def update_transaction(user, id):
    data = request.get_json()
    tr = Transaction.query.filter_by(id=id, user_id=user.id).first()
    if not tr:
        return jsonify({"message": "Not found"}), 404

    tr.amount = float(data.get("amount", tr.amount))
    tr.type = data.get("type", tr.type)
    tr.description = data.get("description", tr.description)
    tr.category = data.get("category", tr.category)

    if "date" in data:
        tr.date = datetime.datetime.strptime(
            data["date"], "%Y-%m-%d"
        ).date()

    db.session.commit()
    return jsonify({"message": "Updated"})

# ---------------------- RUN SERVER ----------------------
if __name__ == "__main__":
    app.run(host="localhost", port=5000, debug=True)
