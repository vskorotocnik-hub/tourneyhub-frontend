interface StarRatingProps {
  rating: number;
  reviews: number;
}

const StarRating = ({ rating, reviews }: StarRatingProps) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const fill = Math.min(1, Math.max(0, rating - (i - 1)));
    stars.push(
      <svg key={i} className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20">
        <defs>
          <linearGradient id={`star-fill-${i}-${rating}`}>
            <stop offset={`${fill * 100}%`} stopColor="#facc15" />
            <stop offset={`${fill * 100}%`} stopColor="#3f3f46" />
          </linearGradient>
        </defs>
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.065 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.284-3.957z"
          fill={`url(#star-fill-${i}-${rating})`}
        />
      </svg>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-px">{stars}</div>
      <span className="text-yellow-400 text-xs font-medium">{rating.toFixed(1)}</span>
      <span className="text-zinc-500 text-xs">({reviews} оценок)</span>
    </div>
  );
};

export default StarRating;
