interface Props {
  className?: string;
}

export default function LoadingSpinner({ className = '' }: Props) {
  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
