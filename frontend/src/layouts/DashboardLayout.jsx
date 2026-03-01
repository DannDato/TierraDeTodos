import MenuBar from "../components/menuBar"

function DashboardLayout({ children }) {
  return (
    <>
        <main className="pb-16">
          {children}
        </main>
        <MenuBar />
    </>
  )
}

export default DashboardLayout