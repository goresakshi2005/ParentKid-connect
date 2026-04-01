import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 transition-colors duration-300">
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Track Your Child's Growth with{' '}
          <span
            className="text-blue-600 dark:text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, #ec4899, #ffffff)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}
          >
            ParentKid Connect
          </span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
          Comprehensive assessments and personalized insights to support your child's development journey
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center mb-16">
          <Link
            to="/signup/parent"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg dark:shadow-pink-500/20"
          >
            I'm a Parent <FiArrowRight />
          </Link>
          <Link
            to="/signup/teen"
            className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:border-pink-500 dark:text-pink-400 dark:hover:bg-pink-500/10 font-semibold transition-all"
          >
            I'm a Teen
          </Link>
          <Link
            to="/signup/expecting"
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg dark:shadow-emerald-500/20"
          >
            I'm Expecting <FiArrowRight />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-md hover:shadow-xl dark:shadow-pink-500/5 transition border border-gray-100 dark:border-slate-800">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Comprehensive Assessments</h3>
            <p className="text-gray-600 dark:text-slate-400">
              Detailed evaluation across health, behavior, routine, and emotional development
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-md hover:shadow-xl dark:shadow-pink-500/5 transition border border-gray-100 dark:border-slate-800">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Progress Tracking</h3>
            <p className="text-gray-600 dark:text-slate-400">
              Monitor growth over time with visual comparisons and trend analysis
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-md hover:shadow-xl dark:shadow-pink-500/5 transition border border-gray-100 dark:border-slate-800">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Personalized Insights</h3>
            <p className="text-gray-600 dark:text-slate-400">
              AI-powered recommendations tailored to your child's specific needs
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;