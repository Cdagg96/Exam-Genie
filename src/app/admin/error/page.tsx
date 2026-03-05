export default async function ErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ reason?: string }>
}) {
    const { reason } = await searchParams;

    let title = "Error";
    let message = "An unexpected error occurred.";

    if (reason === 'invalid-action') {
        title = "Invalid Action";
        message = "Please specify either 'Approved' or 'Denied' as an action.";
    } else if (reason === 'user-not-found') {
        title = "User Not Found";
        message = "The user you're trying to update doesn't exist.";
    } else if (reason === 'server-error') {
        title = "Server Error";
        message = "Failed to update user status. Please try again.";
    }
    return (
        <>
            <head><title>{title}</title></head>
            <div style={{ fontFamily: 'Arial, sans-serif', background: '#f3f8ff', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <h1 style={{ color: '#ef4444', marginBottom: '20px' }}> {title} </h1>
                    <p style={{ color: '#6b7280' }}> {message} </p>
                </div>
            </div>
        </>
    );
}