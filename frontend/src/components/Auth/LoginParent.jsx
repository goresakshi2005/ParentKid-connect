import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

function LoginParent() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const user = await login(values.email, values.password);
        if (user.role === 'parent') {
          // Route expecting/pregnant parents to pregnancy dashboard
          if (user.is_expecting) {
            navigate('/dashboard/pregnancy');
          } else {
            navigate('/dashboard/parent');
          }
        } else {
          alert('Please use the teen login page.');
        }
      } catch (error) {
        alert(error.error || 'Login failed');
      }
    },
  });

  return (
    <div className="max-w-md mx-auto py-24 px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-2xl dark:shadow-pink-500/5 dark:border dark:border-slate-800">
        <h2 className="text-3xl font-bold mb-8 dark:text-white text-center">Parent <span className="dark:text-pink-500">Login</span></h2>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              {...formik.getFieldProps('email')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
              placeholder="name@example.com"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-medium">{formik.errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Password</label>
            <input
              type="password"
              {...formik.getFieldProps('password')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
              placeholder="••••••••"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-medium">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full px-4 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 disabled:opacity-50 font-bold shadow-lg dark:shadow-pink-500/20 transition-all duration-300 transform active:scale-[0.98]"
          >
            {formik.isSubmitting ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>

        <p className="text-center text-sm mt-8 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup/parent" className="text-blue-600 dark:text-pink-400 hover:underline font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginParent;