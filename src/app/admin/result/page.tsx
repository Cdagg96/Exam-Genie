export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams;
  const isApprove = status === 'approved';

  return (
    <>
      <head>
        <title>{`User ${isApprove ? 'Approved' : 'Denied'}`}</title>
      </head>
      <div style={{ fontFamily: 'Arial, sans-serif', background: '#f3f8ff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h1 style={{ color: isApprove ? '#10b981' : '#ef4444', marginBottom: '20px', fontSize: '28px' }}>
            {isApprove ? 'User Approved Successfully!' : 'User Denied'}
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '30px' }}>
            {isApprove ? 'The teacher\'s account has been approved.' : 'The teacher\'s registration has been denied.'}
          </p>
          <a href="/" style={{ background: '#3b82f6', color: 'white', padding: '12px 30px', borderRadius: '6px', textDecoration: 'none' }}>
            Return to Home
          </a>
        </div>
      </div>
    </>
  );
}