export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: "#16181c" }}
    >
      {/* Copper gradient accent at top */}
      <div
        className="absolute top-0 inset-x-0 h-1"
        style={{ background: "linear-gradient(90deg, #93501f, #d98a4f, #93501f)" }}
      />
      {children}
    </div>
  )
}
