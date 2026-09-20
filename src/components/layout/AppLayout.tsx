import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  Fade,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'
import InboxIcon from '@mui/icons-material/InboxOutlined'
import LightModeIcon from '@mui/icons-material/LightModeOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '@/auth/AuthContext'
import { env } from '@/config/env'
import { IMAGES } from '@/lib/assets'
import { useColorMode } from '@/styles/colorMode'

/** Scroll distance after which the header takes over the "New request" call. */
const CTA_REVEAL_AT = 140

const NAV_ITEMS = [
  { to: '/requests', label: 'Requests', icon: <InboxIcon fontSize="small" /> },
  {
    to: '/requests/new',
    label: 'New request',
    icon: <Box component="img" src={IMAGES.add} alt="" sx={{ width: 20, height: 20 }} />,
  },
] as const

/**
 * The brand mark, sized for wherever it is being placed.
 *
 * The artwork is drawn in near-black on transparency, so it is given its own
 * light tile instead of being recoloured: that keeps the mark intact and legible
 * in the dark theme, where it would otherwise vanish into the header.
 */
function Logo({ size }: { size: number }) {
  return (
    <Box
      sx={{
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
        width: size,
        height: size,
        p: 0.5,
        borderRadius: 2.5,
        backgroundColor: '#ffffff',
        border: '1px solid var(--hairline)',
      }}
    >
      <Box
        component="img"
        src={IMAGES.logo}
        alt=""
        sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </Box>
  )
}

/** A pill that lights up when its route is the one being viewed. */
function NavPill({ to, label }: { to: string; label: string }) {
  return (
    <Button
      component={NavLink}
      to={to}
      end
      size="small"
      sx={{
        px: 2,
        minHeight: 36,
        color: 'text.secondary',
        fontWeight: 600,
        '&.active': {
          color: 'text.primary',
          backgroundColor: 'var(--glass-strong)',
          border: '1px solid var(--hairline)',
          boxShadow: 'var(--shadow)',
        },
        '&:hover': { color: 'text.primary', backgroundColor: 'var(--glass-soft)' },
      }}
    >
      {label}
    </Button>
  )
}

function ColorModeToggle() {
  const { mode, toggleColorMode } = useColorMode()
  const next = mode === 'light' ? 'dark' : 'light'

  return (
    <Tooltip title={`Switch to ${next} theme`}>
      <IconButton
        aria-label={`Switch to ${next} theme`}
        onClick={toggleColorMode}
        sx={{ border: '1px solid var(--hairline)', backgroundColor: 'var(--glass-soft)' }}
      >
        {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}

/**
 * True once the page has been scrolled past `CTA_REVEAL_AT`, so the header can
 * pick up the primary action as it leaves the top of the page.
 */
function useScrolledPast(threshold: number): boolean {
  const [isPast, setIsPast] = useState(false)

  useEffect(() => {
    const read = () => setIsPast(window.scrollY > threshold)
    read()
    window.addEventListener('scroll', read, { passive: true })
    return () => window.removeEventListener('scroll', read)
  }, [threshold])

  return isPast
}

/** The signed-in identity, and the menu it opens. */
function UserMenu() {
  const { user, signOut } = useAuth()
  // The trigger element is held in state rather than a ref: the menu needs it
  // during render to position itself.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = anchorEl !== null

  if (!user) return null

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${user.name}`}
        onClick={(event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 0.5,
          pr: { xs: 0.5, md: 1.25 },
          border: '1px solid var(--hairline)',
          borderRadius: 999,
          backgroundColor: 'var(--glass-soft)',
          color: 'text.primary',
          cursor: 'pointer',
          transition: 'background-color 220ms',
          '&:hover': { backgroundColor: 'var(--glass-strong)' },
        }}
      >
        <Avatar
          alt=""
          aria-hidden="true"
          src={IMAGES.user}
          sx={{
            width: 30,
            height: 30,
            backgroundColor: '#ffffff',
            '& img': { objectFit: 'contain', p: 0.5 },
          }}
        />
        <span className="app-header__identity">
          <span className="app-header__name">{user.name}</span>
          {user.email ? <span className="app-header__email">{user.email}</span> : null}
        </span>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ list: { sx: { minWidth: 200 } } }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null)
            void signOut()
          }}
          sx={{ borderRadius: 2, mx: 0.5, gap: 1.5 }}
        >
          <LogoutIcon fontSize="small" />
          Sign out
        </MenuItem>
      </Menu>
    </>
  )
}

function AppHeader({ onOpenNav }: { onOpenNav: () => void }) {
  const showCta = useScrolledPast(CTA_REVEAL_AT)

  return (
    <AppBar className="app-header" component="header" position="sticky" elevation={0}>
      <Toolbar className="app-header__inner" disableGutters>
        <IconButton
          aria-label="Open navigation"
          onClick={onOpenNav}
          edge="start"
          sx={{ display: { md: 'none' }, mr: 0.5 }}
        >
          <Box
            component="img"
            src={IMAGES.menu}
            alt=""
            sx={{
              width: 20,
              height: 20,
              objectFit: 'contain',
              // The artwork is a pale grey; darken it so the control keeps its
              // contrast against the light surface.
              filter: (theme) => (theme.palette.mode === 'light' ? 'brightness(0.35)' : 'none'),
            }}
          />
        </IconButton>

        <Link className="app-header__brand" to="/requests">
          <Logo size={38} />
          <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
            <Typography className="app-header__title" component="span">
              Service Request Portal
            </Typography>
            <Typography className="app-header__subtitle" component="span">
              Customer support operations
            </Typography>
          </Box>
        </Link>

        <Box
          component="nav"
          aria-label="Main"
          sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, mr: 1 }}
        >
          <NavPill to="/requests" label="Requests" />
        </Box>

        <Box className="app-header__user">
          {/*
           * The page header owns the primary action while it is on screen; the
           * bar only picks it up once that call has scrolled away.
           */}
          <Fade in={showCta} unmountOnExit>
            <Button
              component={Link}
              to="/requests/new"
              variant="contained"
              size="small"
              sx={{ mr: 0.5 }}
              startIcon={
                <Box
                  component="img"
                  src={IMAGES.add}
                  alt=""
                  sx={{ width: 18, height: 18, filter: 'brightness(0) invert(1)' }}
                />
              }
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                New request
              </Box>
            </Button>
          </Fade>

          <ColorModeToggle />
          <UserMenu />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

/** Narrow-viewport navigation; the desktop pills live in the header instead. */
function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()

  return (
    <Drawer open={open} onClose={onClose} sx={{ display: { md: 'none' } }}>
      <Box sx={{ width: 268, p: 2 }} role="presentation">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Logo size={36} />
          <Typography sx={{ fontWeight: 650, flex: 1 }}>Service requests</Typography>
          <IconButton aria-label="Close navigation" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              onClick={onClose}
              selected={pathname === item.to}
              sx={{ borderRadius: 3 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }} primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  )
}

/**
 * Chrome shared by every authenticated screen: skip link, header, the routed
 * content region and a footer noting when the mock API is serving data.
 */
export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <AppHeader onOpenNav={() => setNavOpen(true)} />
      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="app-main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
