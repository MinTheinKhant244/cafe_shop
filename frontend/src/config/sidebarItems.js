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
    roles: ["ADMIN", "CASHIER"]
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
    title: "Staffs",
    path: "/admin/staffs",
    icon: "fa-users",
    roles: ["ADMIN"]
  },
  {
    title: "Reports",
    path: "/admin/reports",
    icon: "fa-chart-bar",
    roles: ["ADMIN"]
  },

  {
    title: "Tables",
    path: "/tables",
    icon: "fa-table-list",
    roles: ["ADMIN", "CASHIER"]
  }

];