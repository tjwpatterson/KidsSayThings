import PasswordRecoveryForm from "@/components/auth/password-recovery-form"

export const metadata = {
  title: "Update Password | SaySo",
}

export default function CompleteResetPasswordPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif font-bold">Choose a new password</h1>
          <p className="text-muted-foreground">
            For your security, reset links expire quickly. Complete this step to regain access.
          </p>
        </div>
        <PasswordRecoveryForm />
      </div>
    </div>
  )
}


