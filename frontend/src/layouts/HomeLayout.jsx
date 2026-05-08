import Navbar from "../components/home/Navbar"
import Footer from "../components/home/Footer"

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