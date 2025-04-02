import Dashboard from "../pages/dashboard";
import Categories from "../pages/categories";
import Models from "../pages/models";

export const routes = [
    {
        id: 1,
        path: '/',
        component: <Dashboard/>
    },
    {
        id: 2,
        path: '/models',
        component: <Models/>
    },
    {
        id: 3,
        path: '/categories',
        component: <Categories/>
    }
]