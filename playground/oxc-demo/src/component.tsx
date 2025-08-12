// Simple JSX component to demonstrate oxc JSX transformation
interface ComponentProps {
  title: string;
  description?: string;
}

function SimpleComponent({ title, description }: ComponentProps) {
  return (
    <div className="component">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

// Modern JSX with automatic runtime
export function createReactExample() {
  const props = {
    title: 'Oxc JSX Transform',
    description: 'This demonstrates JSX transformation via oxc with automatic runtime'
  };

  return <SimpleComponent {...props} />;
}

export default SimpleComponent;