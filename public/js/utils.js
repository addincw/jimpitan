const select2AjaxHandler = function (selector, url, options = {}) {
	const {
		defaultSelectedId = "",
		onlyLoadSelected = false,
		...select2Options
	} = options;

	if (!onlyLoadSelected) {
		$(selector).select2({
			...select2Options,
			ajax: {
				url: `${url}`,
				data: function (params) {
					var query = { searchKey: params.term };
					return query;
				},
				processResults: function (data) {
					return {
						results: data.map((item) => {
							item.text = item.name;
							return item;
						}),
					};
				},
			},
		});
	}

	if (defaultSelectedId) {
		var uri =
			defaultSelectedId !== "custom" ? `${url}/${defaultSelectedId}` : url;

		$.ajax({
			type: "GET",
			url: uri,
			success: function (response) {
				var newOption = new Option(`${response.name}`, response.id, true, true);
				$(selector).append(newOption).trigger("change");
			},
			error: function (err) {
				console.log(`failed fetch : ${err}`);
			},
		});
	}
};
