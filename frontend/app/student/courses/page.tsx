'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { coursesAPI } from '@/lib/api';

const NAV = [
  { href: '/student/courses', label: 'الكورسات', icon: '🎓' },
  { href: '/student/books', label: 'الكتب', icon: '📚' },
];

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesAPI.getAll().then(r => setCourses(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout requiredRole="student" navItems={NAV}>
      <div className="page-header">
        <h1 className="page-title">الكورسات</h1>
        <p className="page-subtitle">استعرض الكورسات المتاحة على المنصة</p>
      </div>

      {loading ? (
        <div className="courses-grid">
          {[1,2,3].map(i => <div key={i} className="course-card"><div className="skeleton" style={{ height: 160 }} /><div style={{ padding: 16 }}><div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 8 }} /><div className="skeleton" style={{ height: 14, width: '90%' }} /></div></div>)}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎓</div>
          <h3>لا توجد كورسات متاحة حالياً</h3>
          <p>سيتم إضافة الكورسات قريباً</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card" style={{ cursor: course.coming_soon ? 'default' : 'pointer', opacity: course.coming_soon ? 0.85 : 1 }}>
              <div style={{ position: 'relative' }}>
                {course.cover_image_url ? (
                  <img src={course.cover_image_url} alt={course.title} className="course-cover" />
                ) : (
                  <div className="course-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎓</div>
                )}
                {course.coming_soon && <div className="coming-soon-badge">⏰ يتم الإضافة قريباً</div>}
              </div>
              <div className="course-info">
                <h3 className="course-title">{course.title}</h3>
                {course.description && <p className="course-desc">{course.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
