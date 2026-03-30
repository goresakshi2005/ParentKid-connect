import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Track Your Child's Growth with <span className="text-blue-600">ParentKid Connect</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Comprehensive assessments and personalized insights to support your child's development journey
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center mb-16">
          <Link
            to="/signup/parent"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
          >
            I'm a Parent <FiArrowRight />
          </Link>
          <Link
            to="/signup/teen"
            className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold"
          >
            I'm a Teen
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Comprehensive Assessments</h3>
            <p className="text-gray-600">
              Detailed evaluation across health, behavior, routine, and emotional development
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-3">Progress Tracking</h3>
            <p className="text-gray-600">
              Monitor growth over time with visual comparisons and trend analysis
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">Personalized Insights</h3>
            <p className="text-gray-600">
              AI-powered recommendations tailored to your child's specific needs
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;