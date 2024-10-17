const callToast = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	toast: any,
	title: string,
	desc: string,
) => {
	toast({
		title: title,
		description: desc,
		duration: 5000,
	})
}

export { callToast }