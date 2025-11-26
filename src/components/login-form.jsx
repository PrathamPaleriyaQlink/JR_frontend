import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { User, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { useEffect, useState } from "react";

export function LoginForm({ className, ...props }) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setEmployeeData } = useAdmin();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setIsDark(saved === "dark");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://api.vultr3.qlink.in/api/web/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_id: empId,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      setEmployeeData({
        empId: data.data.emp_id,
        empName: data.data.name,
        category: data.data.category,
      });

      navigate("/admin");
    } catch (err) {
      setError("Server error. Try again.");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <img
            src={"/logo.webp"}
            className="w-34"
          />
          <h1 className="text-2xl font-bold">Support Chatbot</h1>

          <p className="text-muted-foreground text-sm text-balance">
            Enter your credentials to access the agent dashboard
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">Employee ID</FieldLabel>
          <Input
            id="email"
            placeholder="EMP123"
            onChange={(e) => setEmpId(e.target.value)}
            required
          />
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            {/* <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a> */}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Field>
          <Button
            type="submit"
            variant={error ? "destructive" : "default"}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Logging in...
              </>
            ) : error ? (
              error
            ) : (
              "Login as Agent"
            )}
          </Button>
        </Field>

        <FieldSeparator>Or continue as</FieldSeparator>

        <Field>
          <Link to="/user" className="w-full">
            <Button variant="outline" type="button" className="w-full">
              <User />
              User Mode
            </Button>
          </Link>
        </Field>
      </FieldGroup>
    </form>
  );
}
