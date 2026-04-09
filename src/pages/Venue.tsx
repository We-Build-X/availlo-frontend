import { venueRoute } from '../router'

export default function Venue() {
  const { id } = venueRoute.useParams()
  return <div className="p-2">Venue ID: {id}</div>
}
