export const T = {
  light: {
    bg:'#FFF8F0' as string,bgCard:'#FFFFFF' as string,bgCard2:'#FFF3E8' as string,bgInput:'#F5EDE3' as string,
    border:'#E8D5C0' as string,textPrimary:'#1A0F00' as string,textSec:'#7A6050' as string,textMuted:'#B09880' as string,
    accent:'#FF4D1C' as string,accentBg:'#FFF0EB' as string,gold:'#E67C00' as string,
    green:'#1B7A3E' as string,greenBg:'#E8F7EF' as string,red:'#D63A2A' as string,redBg:'#FDECEA' as string,
    navBg:'#FFFFFF' as string,navBorder:'#EEE0D0' as string,headerBg:'rgba(255,248,240,.95)' as string,
    shadow:'0 2px 12px rgba(200,120,60,.1)' as string,shadowHover:'0 6px 28px rgba(200,100,40,.18)' as string,
  },
  dark: {
    bg:'#060606' as string,bgCard:'#0c0c0c' as string,bgCard2:'#100800' as string,bgInput:'#111' as string,
    border:'#181818' as string,textPrimary:'#FFFFFF' as string,textSec:'#888' as string,textMuted:'#444' as string,
    accent:'#E8580A' as string,accentBg:'#1a0800' as string,gold:'#FFB300' as string,
    green:'#4caf50' as string,greenBg:'#061506' as string,red:'#ef5350' as string,redBg:'#1a0303' as string,
    navBg:'#090909' as string,navBorder:'#0f0f0f' as string,headerBg:'rgba(9,9,9,.95)' as string,
    shadow:'none' as string,shadowHover:'0 4px 24px rgba(232,88,10,.18)' as string,
  }
}

export type ThemeTokens = typeof T.light
export type ThemeMode = 'light' | 'dark'
