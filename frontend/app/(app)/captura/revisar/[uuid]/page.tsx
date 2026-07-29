import { ReviewScreen } from "@/components/review-screen";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  return <ReviewScreen uuid={uuid} />;
}
