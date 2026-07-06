import CropAdvisor from '@/components/crop-advisor'

export default function AdvisoryPage() { return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Kisan guide · किसान मार्गदर्शिका</p><h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold text-ink">Right input, right crop, right time.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-body">Crop choose karke practical checkpoints aur relevant product groups dekhein.</p><div className="mt-8"><CropAdvisor /></div></main> }
