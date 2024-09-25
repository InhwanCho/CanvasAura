import { Navbar } from "./_components/navbar";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">대시보드</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">카드 1</h2>
            <p>카드 내용</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">카드 2</h2>
            <p>카드 내용</p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">카드 3</h2>
            <p>카드 내용</p>
          </div>
        </div>
      </main>
    </div>
  );
}