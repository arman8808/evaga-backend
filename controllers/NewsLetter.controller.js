import NewsLetter from "../modals/newletter.js";

const handleError = (
  res,
  error,
  message = "An error occurred",
  statusCode = 500
) => {
  console.error(error);
  res.status(statusCode).json({ message, error: error.message });
};

export const getAllUrls = async (req, res) => {
  try {
    const urls = await NewsLetter.find();
    res.status(200).json(urls);
  } catch (error) {
    handleError(res, error);
  }
};

export const createUrl = async (req, res) => {
  try {
    const { title, url, status } = req.body;

    if (!url || !status || !title) {
      return res.status(400).json({ message: "URL and status are required" });
    }

    const newUrl = await NewsLetter.create({ title, url, status });
    res.status(201).json(newUrl);
  } catch (error) {
    handleError(res, error, "Failed to create URL", 400);
  }
};

export const getUrlById = async (req, res) => {
  try {
    const { id } = req.params;
    const url = await NewsLetter.findById(id);

    if (!url) {
      return res.status(404).json({ message: "URL not found" });
    }

    res.status(200).json(url);
  } catch (error) {
    handleError(res, error, "Failed to fetch URL");
  }
};

export const updateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, status } = req.body;

    const existingUrl = await NewsLetter.findById(id);

    if (!existingUrl) {
      return res.status(404).json({ message: "URL not found" });
    }

    const updatedData = {
      title: title || existingUrl.title,
      url: url || existingUrl.url,
      status: status || existingUrl.status,
    };

    const updatedUrl = await NewsLetter.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json(updatedUrl);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to update URL", error: error.message });
  }
};

export const deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUrl = await NewsLetter.findByIdAndDelete(id);

    if (!deletedUrl) {
      return res.status(404).json({ message: "URL not found" });
    }

    res.status(200).json({ message: "URL deleted successfully" });
  } catch (error) {
    handleError(res, error, "Failed to delete URL");
  }
};
export const getAllPublishedUrls = async (req, res) => {
  try {
    const urls = await NewsLetter.find({ status: "publish" }).select("url");
    res.status(200).json(urls);
  } catch (error) {
    handleError(res, error);
  }
};
