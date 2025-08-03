import { Button } from '@/components/ui/button';
import { createRootRoute, Outlet, useRouter } from '@tanstack/react-router'
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
  errorComponent: ({ error }) => {
    const router = useRouter();

    return (
      <div className="text-destructive p-5 font-mono">
        <span className="font-bold text-2xl">Error in client: <br /></span>
        <p className="my-3 font-mono">{error.message}</p>
        <Button
          variant={"destructive"}
          className="cursor-pointer"
          onClick={() => {
            // Invalidate the route to reload the loader, which will also reset the error boundary
            router.invalidate();
          }}
        >
          retry
        </Button>
      </div>
    )
  },
})