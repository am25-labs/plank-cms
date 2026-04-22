import { useParams } from 'react-router-dom'

export function ContentTypeForm() {
  const { slug } = useParams()
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{slug ? `Edit: ${slug}` : 'New Content Type'}</h1>
    </div>
  )
}
