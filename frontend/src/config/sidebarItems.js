export const sidebarItems = [
 
  {
    title: "Cashier POS",
    path: "/pos",
    icon: "fa-cash-register",
    roles: ["CASHIER"]   //  Cashier only
  },
  {
    title: "Cashier Orders",
    path: "/cashier/orders",
    icon: "fa-clipboard-list",
    roles: ["CASHIER"]  //  Cashier only
  },

  {
    title: "Dashboard",
    path: "/admin/dashboard",
    icon: "fa-chart-line",
    roles: ["ADMIN"]
  },
  {
    title: "Orders",
    path: "/orders",
    icon: "fa-receipt",
    roles: ["ADMIN"]
  },
  {
    title: "Products",
    path: "/admin/menu-items",
    icon: "fa-bowl-food",
    roles: ["ADMIN"]
  },
  {
    title: "Recipes",
    path: "/admin/recipes",
    icon: "fa-kitchen-set", 
    roles: ["ADMIN"]
  },
  {
    title: "Categories",
    path: "/admin/categories",
    icon: "fa-tags",
    roles: ["ADMIN"]
  },
  {
    title: "Tables",
    path: "/tables",
    icon: "fa-table-list",
    roles: ["ADMIN", "CASHIER"]
  },
  {
    title: "Inventory",
    path: "/admin/inventory",
    icon: "fa-boxes-stacked",
    roles: ["ADMIN"]
  },
  {
    title: "Inv Transactions",  
    path: "/admin/invTransactions",
    icon: "fa-clock-rotate-left",
    roles: ["ADMIN"]
  },
  {
    title: "Users",
    path: "/admin/staffs",
    icon: "fa-users",
    roles: ["ADMIN"]
  }

];