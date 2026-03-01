import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Shipping } from './pages/Shipping';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { MyOrders } from './pages/MyOrders';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'catalog',
        Component: Catalog,
      },
      {
        path: 'product/:id',
        Component: ProductDetail,
      },
      {
        path: 'cart',
        Component: Cart,
      },
      {
        path: 'shipping',
        Component: Shipping,
      },
      {
        path: 'checkout',
        Component: Checkout,
      },
      {
        path: 'admin',
        Component: Admin,
      },
      {
        path: 'my-orders',
        Component: MyOrders,
      },
    ],
  },
  {
    path: 'signin',
    Component: SignIn,
  },
  {
    path: 'signup',
    Component: SignUp,
  },
]);