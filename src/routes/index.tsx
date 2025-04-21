import PatientExperts from "../pages/patient/Experts";

{
  path: "patient",
  element: <PatientRoutes />,
  children: [
    {
      index: true,
      element: <Dashboard />,
    },
    {
      path: "dashboard",
      element: <Dashboard />,
    },
    {
      path: "experts",
      element: <PatientExperts />,
    },
  ],
}, 