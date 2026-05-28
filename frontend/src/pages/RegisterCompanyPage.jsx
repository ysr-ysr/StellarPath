import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import { getApiError } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, formState } = useForm();

  const onSubmit = async (values) => {
    try {
      const data = await authApi.registerCompany({
        email: values.email,
        password: values.password,
        company_name: values.companyName,
      });
      setAuth(data);
      toast.success("Company account created");
      navigate("/company/dashboard");
    } catch (error) {
      toast.error(getApiError(error));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Company registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            placeholder="Company name"
            {...register("companyName", { required: true })}
          />
          <Input
            type="email"
            placeholder="Email"
            {...register("email", { required: true })}
          />
          <Input
            type="password"
            placeholder="Password"
            {...register("password", { required: true, minLength: 6 })}
          />
          <Button className="w-full" disabled={formState.isSubmitting}>
            Create account
          </Button>
        </form>
        <Link className="mt-5 block text-sm text-primary" to="/login">
          Already have an account?
        </Link>
      </CardContent>
    </Card>
  );
}
