import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#6366f1', // Indigo
            light: '#818cf8',
            dark: '#4f46e5',
        },
        background: {
            default: '#09090b', // Zinc 950
            paper: '#18181b',   // Zinc 900
        },
        text: {
            primary: '#fafafa',
            secondary: '#a1a1aa',
        },
        divider: '#27272a',
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            fontSize: '1.5rem',
            background: 'linear-gradient(to right, #fff, #a1a1aa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
            },
        },
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: '#6366f1',
                },
                thumb: {
                    boxShadow: 'none',
                    '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0px 0px 0px 8px rgba(99, 102, 241, 0.16)',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #27272a',
                    padding: '12px 16px',
                },
                head: {
                    backgroundColor: '#09090b',
                    fontWeight: 600,
                },
            },
        },
    },
});

export default theme;
