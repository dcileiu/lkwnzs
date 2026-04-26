import AnimatedCharactersLoginPage from "./animated-characters-login-page"

interface LoginPageProps {
  searchParams: Promise<{
    next?: string
  }>
}

function resolveSafeNext(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) {
    return "/dashboard"
  }
  return raw
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const nextPath = resolveSafeNext(params.next)
  return <AnimatedCharactersLoginPage nextPath={nextPath} />
}
