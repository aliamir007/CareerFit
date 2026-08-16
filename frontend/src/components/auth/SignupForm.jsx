import { useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import { InlineError } from "../common/States";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../api/axiosInstance";
import { GoogleLogin } from "@react-oauth/google";
export default function SignupForm({ onSuccess }) {
  const { register, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const errors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = "Enter a valid email address.";
    }
    if (form.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters.";
    }
    if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      onSuccess?.(user);
    } catch (err) {
      // e.g. "User with this email or username already exists" — shown as-is.
      setError(getErrorMessage(err, "Could not create your account."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={update("email")}
        error={fieldErrors.email}
        autoComplete="email"
      />
      <Input
        label="Username"
        value={form.username}
        onChange={update("username")}
        error={fieldErrors.username}
        autoComplete="username"
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={update("password")}
        error={fieldErrors.password}
        hint="At least 8 characters."
        autoComplete="new-password"
      />

      <InlineError message={error} />

      <Button type="submit" loading={submitting} className="mt-1 w-full">
        Create account
      </Button>
      
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>

        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2">OR</span>
        </div>
      </div>

      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            const user = await googleLogin(credentialResponse.credential);
            onSuccess?.(user);
          } catch (err) {
            setError(getErrorMessage(err, "Google login failed."));
          }
        }}
        onError={() => {
          setError("Google Sign-In failed.");
        }}
      />
    </form>
  );
}
