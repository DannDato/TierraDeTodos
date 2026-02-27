import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function HomeLayout({ children }) {
  return (
    <>
      <Navbar />
        <main>
          {children}
        </main>
      <Footer />
    </>
  )
}

export default HomeLayout