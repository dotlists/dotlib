import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/list/$listId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { listId } = Route.useParams()
  return <div></div>
}
