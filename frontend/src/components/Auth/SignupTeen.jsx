import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  inviteCode: Yup.string().required('Invite code from your parent is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

function SignupTeen() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      inviteCode: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await signup(values.email, values.password, values.firstName, values.lastName, 'teen', values.inviteCode);
        setTimeout(() => {
          navigate('/dashboard/teen');
        }, 100);
      } catch (error) {
        if (!localStorage.getItem('access_token')) {
          alert(error.error || 'Signup failed. Please check your invite code.');
        }
      }
    },
  });

  return (
    <div className="max-w-md mx-auto py-24 px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-2xl dark:shadow-pink-500/5 dark:border dark:border-slate-800">
        <h2 className="text-3xl font-bold mb-8 dark:text-white text-center">Teen <span className="dark:text-pink-500">Signup</span></h2>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 dark:text-slate-300">First Name</label>
              <input
                type="text"
                {...formik.getFieldProps('firstName')}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
                placeholder="Name"
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
                placeholder="Surname"
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
            <label className="block text-sm font-semibold mb-2 dark:text-slate-300 text-blue-600 dark:text-pink-400 flex items-center gap-2 italic">
              <span>Invite Code</span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-pink-500/20 rounded">From Parent</span>
            </label>
            <input
              type="text"
              {...formik.getFieldProps('inviteCode')}
              placeholder="e.g. AB1234CD"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none uppercase font-mono font-bold tracking-widest bg-blue-50/50 dark:bg-pink-500/5 border-dashed border-2 dark:border-pink-500/30"
            />
            {formik.touched.inviteCode && formik.errors.inviteCode && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-2 font-medium">{formik.errors.inviteCode}</p>
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
            {formik.isSubmitting ? 'Joining platform...' : 'Create Teen Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-8 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login/teen" className="text-blue-600 dark:text-pink-400 hover:underline font-bold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupTeen;