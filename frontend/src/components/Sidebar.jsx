import { menuItems } from "./menuItems"

function Sidebar() {

  const user = JSON.parse(localStorage.getItem("user"))
  const role = user?.role

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-4">

      <h2 className="text-xl mb-4">Cafe POS</h2>

      {menuItems
        .filter(item => item.roles.includes(role))
        .map((item, index) => (
          <a
            key={index}
            href={item.path}
            className="block p-2 hover:bg-gray-700 rounded"
          >
            {item.title}
          </a>
        ))
      }

    </div>
  )
}

export default Sidebar