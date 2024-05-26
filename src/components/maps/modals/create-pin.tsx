import { zodResolver } from "@hookform/resolvers/zod";
import { Maximize } from "lucide-react";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "~/utils/api";

export const createPinFormSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  description: z.string(),
  title: z.string().min(3),
  image: z.string().url().optional(),
  startDate: z.date().min(new Date()),
  endDate: z.date().min(new Date()),
  autoCollect: z.boolean(),
  limit: z.number().nonnegative().min(1),
});

export default function CreatePinModal({
  modal,
  position,
}: {
  modal: React.RefObject<HTMLDialogElement>;
  position?: google.maps.LatLngLiteral;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof createPinFormSchema>>({
    resolver: zodResolver(createPinFormSchema),
    defaultValues: {
      lat: position?.lat,
      lng: position?.lng,
    },
  });

  function resetState() {
    // console.log("hi");
    reset();
  }

  console.log(errors, "er");

  const addPinM = api.maps.pin.createPin.useMutation({
    onSuccess: () => {
      reset();
      modal.current?.close();
      toast.success("Pin created successfully");
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof createPinFormSchema>> = (
    data,
  ) => {
    if (position) {
      setValue("lat", position?.lat);
      setValue("lng", position?.lng);
      addPinM.mutate(data);
    } else {
      toast.error("Please select a location on the map");
    }
  };
  return (
    <>
      <dialog className="modal" ref={modal}>
        <div className="modal-box">
          <form method="dialog">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={() => resetState()}
            >
              ✕
            </button>
          </form>
          <form className="mt-5" onSubmit={handleSubmit(onSubmit)}>
            <h2 className="mb-2 text-center text-lg font-bold">Create Pin</h2>
            <div className="flex flex-col space-y-4">
              <p>
                Latitude: <span className="text-blue-500">{position?.lat}</span>
                <br></br>
                Longitude:{" "}
                <span className="text-blue-500">{position?.lng}</span>
              </p>

              <div className="flex flex-col space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  {...register("title")}
                  className="input input-bordered"
                />
                {errors.title && (
                  <p className="text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  className="input input-bordered"
                />
                {errors.description && (
                  <p className="text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="image" className="text-sm font-medium">
                  Image
                </label>
                <input
                  type="text"
                  id="image"
                  {...register("image")}
                  className="input input-bordered"
                />
                {errors.image && (
                  <p className="text-red-500">{errors.image.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  {...register("startDate", { valueAsDate: true })}
                  className="input input-bordered"
                />
                {errors.startDate && (
                  <p className="text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  {...register("endDate", { valueAsDate: true })}
                  className="input input-bordered"
                />
                {errors.endDate && (
                  <p className="text-red-500">{errors.endDate.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoCollect"
                  {...register("autoCollect")}
                  className="checkbox"
                />
                <label htmlFor="autoCollect" className="text-sm">
                  Auto Collect
                </label>
              </div>

              <div className="flex flex-col space-y-2">
                <label htmlFor="limit" className="text-sm font-medium">
                  Limit
                </label>
                <input
                  type="number"
                  id="limit"
                  {...register("limit", { valueAsNumber: true })}
                  className="input input-bordered"
                />
                {errors.limit && (
                  <p className="text-red-500">{errors.limit.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={addPinM.isLoading}
                // onClick={handleSubmit((data) => console.log(data))}
              >
                {addPinM.isLoading ? (
                  <div className="flex justify-center">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  "Submit"
                )}
                Submit
              </button>
            </div>
          </form>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn" onClick={() => resetState()}>
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
