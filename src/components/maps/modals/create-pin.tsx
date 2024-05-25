import { zodResolver } from "@hookform/resolvers/zod";
import { Maximize } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createPinFormSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  description: z.string(),
  title: z.string().min(3),
  image: z.string().url().optional(),
  startDate: z.date().min(new Date()),
  endDate: z.date().min(new Date()),
  autoCollect: z.boolean(),
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

  function resetState() {}

  return (
    <>
      <dialog className="modal" ref={modal}>
        <div className="modal-box">
          <form method="dialog" className="">
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              onClick={() => resetState()}
            >
              ✕
            </button>
            <div className="flex flex-col space-y-4">
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

              <button
                type="submit"
                className="btn btn-primary"
                onClick={handleSubmit((data) => console.log(data))}
              >
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
