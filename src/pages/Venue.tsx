import { useParams } from '@tanstack/react-router'

export default function Venue() {
  const { id } = useParams({ from: '/venue/$id' })
  return <div className="p-2">Venue ID: {id}</div>
}
