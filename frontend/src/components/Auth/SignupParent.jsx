import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

function SignupParent() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await signup(values.email, values.password, values.firstName, values.lastName, 'parent');
        // Give the global state a moment to update before navigating
        setTimeout(() => {
          navigate('/dashboard/parent');
        }, 100);
      } catch (error) {
        // Only alert if we don't have a token (meaning signup actually failed)
        if (!localStorage.getItem('access_token')) {
          alert(error.error || 'Signup failed. Please try a different email.');
        }
      }
    },
  });

  return (
    <div className="max-w-md mx-auto py-24 px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-2xl dark:shadow-pink-500/5 dark:border dark:border-slate-800">
        <h2 className="text-3xl font-bold mb-8 dark:text-white text-center">Parent <span className="dark:text-pink-500">Signup</span></h2>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-slate-300">First Name</label>
              <input
                type="text"
                {...formik.getFieldProps('firstName')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
                placeholder="John"
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{formik.errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Last Name</label>
              <input
                type="text"
                {...formik.getFieldProps('lastName')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
                placeholder="Doe"
              />
              {formik.touched.lastName && formik.errors.lastName && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{formik.errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              {...formik.getFieldProps('email')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
              placeholder="name@example.com"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{formik.errors.email}</p>
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
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{formik.errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Confirm Password</label>
            <input
              type="password"
              {...formik.getFieldProps('confirmPassword')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
              placeholder="••••••••"
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full px-4 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 disabled:opacity-50 font-bold shadow-lg dark:shadow-pink-500/20 transition-all duration-300 transform active:scale-[0.98]"
          >
            {formik.isSubmitting ? 'Creating account...' : 'Create Parent Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-8 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login/parent" className="text-blue-600 dark:text-pink-400 hover:underline font-bold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupParent;