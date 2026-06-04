export const schoolShadows = {
  none: {
    shadowOpacity: 0
  },
  surface: {
    shadowColor: "#101216",
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  raised: {
    shadowColor: "#101216",
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }
  },
  hero: {
    shadowColor: "#28325A",
    shadowOpacity: 0.1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 12 }
  }
} as const;
