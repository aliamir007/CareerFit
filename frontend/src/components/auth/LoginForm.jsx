import { useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import { InlineError } from "../common/States";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../api/axiosInstance";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginForm({ onSuccess }) {
  const { login, googleLogin } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const user = await login({ identifier: identifier.trim(), password });
      onSuccess?.(user);
    } catch (err) {
      // The backend distinguishes "user does not exist" from "invalid password";
      // showing its message verbatim keeps that distinction.
      setError(getErrorMessage(err, "Could not log you in."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email or username"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        autoComplete="username"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <InlineError message={error} />

      <Button type="submit" loading={submitting} className="mt-1 w-full">
        Log in
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
