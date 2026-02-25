import Navbar from "../components/Navbar"
import Footer from "../components/Footer"

function HomeLayout({ children }) {
  return (
    <>
      <link rel="stylesheet" href="/styles/homeLayout.css" />
      <body className="home-layout">
        <Navbar />
          <main>
            {children}
          </main>
        <Footer />
      </body>
    </>
  )
}

export default HomeLayout