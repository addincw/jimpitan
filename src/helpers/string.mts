export function generateRandomString(length: number = 4) {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}

	return result;
}

export function generateRandomRGBColor(opacity = "1") {
	var r = Math.floor(Math.random() * 256);
	var g = Math.floor(Math.random() * 256);
	var b = Math.floor(Math.random() * 256);
	return `rgb(${r}, ${g}, ${b}, ${opacity})`;
}

export function toFormatCurrency(value = 0) {
	return new Intl.NumberFormat("id-ID", { maximumSignificantDigits: 2 }).format(value);
}
