import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

function LoginTeen() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const user = await login(values.email, values.password);
        if (user.role === 'teen') {
          navigate('/dashboard/teen');
        } else {
          alert('Please use the parent login page.');
        }
      } catch (error) {
        alert(error.error || 'Login failed');
      }
    },
  });

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <div className="bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Teen Login</h2>

        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...formik.getFieldProps('email')}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              {...formik.getFieldProps('password')}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-sm">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {formik.isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Don't have an account?{' '}
          <Link to="/signup/teen" className="text-blue-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginTeen;