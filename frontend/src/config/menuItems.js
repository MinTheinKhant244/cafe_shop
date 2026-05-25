export const menuItems = [
  {
    title: "Dashboard",
    path: "/admin/dashboard",
    roles: ["ADMIN"]
  },
  {
    title: "Products",
    path: "/admin/products",
    roles: ["ADMIN"]
  },
  {
    title: "Orders",
    path: "/admin/orders",
    roles: ["ADMIN", "CASHIER"]
  },
  {
    title: "Cashier POS",
    path: "/cashier",
    roles: ["CASHIER"]
  },
  {
    title: "Reports",
    path: "/admin/reports",
    roles: ["ADMIN"]
  }
]