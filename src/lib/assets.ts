/**
 * Brand artwork served straight from `public/assets/images`.
 *
 * The paths are built from `BASE_URL` rather than hard-coded with a leading
 * slash, so the portal keeps working when it is deployed under a sub-path.
 */
const base = import.meta.env.BASE_URL

export const IMAGES = {
  logo: `${base}assets/images/logo.png`,
  user: `${base}assets/images/user.png`,
  menu: `${base}assets/images/menu.png`,
  add: `${base}assets/images/add.png`,
  loginWallpaper: `${base}assets/images/login-wallpaper.jpg`,
} as const
