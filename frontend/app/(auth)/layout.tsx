export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md space-y-8">
        {children}
      </div>
    </div>
  );
}
