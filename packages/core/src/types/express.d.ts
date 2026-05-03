declare global {
  namespace Express {
    interface Request {
      user?: { id: string; roleId: string }
      appModes?: { editorial: boolean }
    }
  }
}

export {}
